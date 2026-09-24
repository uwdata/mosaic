package main

import (
	"errors"
	"strings"
)

type gatekeeperFlag struct{ document *string }

func (f *gatekeeperFlag) String() string {
	if f.document == nil {
		return ""
	}
	return *f.document
}

func (f *gatekeeperFlag) Set(value string) error {
	if f.document != nil {
		return errors.New("gatekeeper may only be specified once")
	}
	f.document = &value
	return nil
}

type optionalCommaListFlag struct {
	values []string
}

func (f *optionalCommaListFlag) Set(value string) error {
	if value != "" {
		f.values = append(f.values, strings.Split(value, ",")...)
	}
	return nil
}

func (f *optionalCommaListFlag) String() string { return strings.Join(f.values, ",") }
