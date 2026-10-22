use anyhow::{Context, Result};
use axum_server_dual_protocol::axum_server::tls_rustls::RustlsConfig;
use std::{env, ffi::OsString, path::PathBuf};

fn config_directory(os: &str, get: impl Fn(&str) -> Option<OsString>) -> Option<PathBuf> {
    let value = |name| {
        get(name)
            .filter(|value| !value.is_empty())
            .map(PathBuf::from)
    };
    match os {
        "windows" => value("APPDATA"),
        "macos" => value("HOME").map(|home| home.join("Library/Application Support")),
        _ => value("XDG_CONFIG_HOME").or_else(|| value("HOME").map(|home| home.join(".config"))),
    }
}

fn find_certificates(directories: impl IntoIterator<Item = PathBuf>) -> Option<(PathBuf, PathBuf)> {
    directories.into_iter().find_map(|dir| {
        let cert = dir.join("localhost.pem");
        let key = dir.join("localhost-key.pem");
        (cert.exists() && key.exists()).then_some((cert, key))
    })
}

pub async fn configure() -> Result<Option<RustlsConfig>> {
    let mut directories = vec![env::current_dir()?];
    if let Some(config) = config_directory(env::consts::OS, |name| env::var_os(name)) {
        directories.push(config.join("mosaic/https"));
    }
    match find_certificates(directories) {
        Some((cert, key)) => {
            let config = RustlsConfig::from_pem_file(&cert, &key)
                .await
                .with_context(|| {
                    format!(
                        "load TLS certificate {} and key {}",
                        cert.display(),
                        key.display()
                    )
                })?;
            tracing::info!(certificate = %cert.display(), "using TLS certificate");
            Ok(Some(config))
        }
        None => Ok(None),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{collections::HashMap, fs};

    #[test]
    fn platform_directories() {
        let values = HashMap::from([
            ("HOME", "/home/test"),
            ("XDG_CONFIG_HOME", "/xdg"),
            ("APPDATA", "/roaming"),
        ]);
        let get = |name: &str| values.get(name).map(OsString::from);
        assert_eq!(config_directory("linux", get), Some(PathBuf::from("/xdg")));
        assert_eq!(
            config_directory("macos", get),
            Some(PathBuf::from("/home/test/Library/Application Support"))
        );
        assert_eq!(
            config_directory("windows", get),
            Some(PathBuf::from("/roaming"))
        );
        assert_eq!(
            config_directory("linux", |name| (name == "HOME")
                .then(|| "/home/test".into())),
            Some(PathBuf::from("/home/test/.config"))
        );
        assert_eq!(config_directory("linux", |_| None), None);
    }

    #[test]
    fn complete_pairs_in_order() -> Result<()> {
        let root = env::temp_dir().join(format!("mosaic-cert-test-{}", std::process::id()));
        fs::create_dir_all(&root)?;
        let local = root.join("local");
        let shared = root.join("shared");
        fs::create_dir_all(&local)?;
        fs::create_dir_all(&shared)?;
        let directories = || vec![local.clone(), shared.clone()];
        assert!(find_certificates(directories()).is_none());
        fs::write(local.join("localhost.pem"), "local")?;
        fs::write(shared.join("localhost-key.pem"), "shared")?;
        assert!(find_certificates(directories()).is_none());
        fs::write(shared.join("localhost.pem"), "shared")?;
        assert_eq!(
            find_certificates(directories()).unwrap().0,
            shared.join("localhost.pem")
        );
        fs::write(local.join("localhost-key.pem"), "local")?;
        assert_eq!(
            find_certificates(directories()).unwrap().0,
            local.join("localhost.pem")
        );
        fs::remove_dir_all(root)?;
        Ok(())
    }
}
