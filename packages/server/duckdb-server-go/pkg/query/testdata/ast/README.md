# Serialized AST fixtures

`v2.0.0-alpha41489` contains output captured from DuckDB commit `10de957379`,
using `system.main.json_serialize_sql` with `skip_default`, `skip_empty`, and
`skip_null` enabled. Inputs:

```sql
SELECT * FROM tenant_a.t;
WITH deleted AS (DELETE FROM tenant_a.t RETURNING *) SELECT * FROM deleted;
WITH inserted AS (INSERT INTO tenant_a.t VALUES (2) RETURNING *) SELECT * FROM inserted;
WITH updated AS (UPDATE tenant_a.t SET id=2 RETURNING *) SELECT * FROM updated;
WITH copied AS (COPY tenant_a.t TO '/tmp/unused-probe.csv') SELECT * FROM copied;
```

All five serialize successfully in this alpha. The validator deliberately rejects
this unreviewed AST format, including its ordinary SELECT output. These fixtures
test rejection on the pinned stable runtime without installing the alpha or
executing the statements. Synthetic stable-shaped write nodes are tested separately
so rejection does not depend only on the alpha's added location fields.
