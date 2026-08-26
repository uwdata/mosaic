package main

import "strings"

type optionalCommaListFlag struct {
	values []string
	set    bool
}

func (f *optionalCommaListFlag) Set(value string) error {
	f.set = true
	if value != "" {
		f.values = append(f.values, strings.Split(value, ",")...)
	}
	return nil
}

func (f *optionalCommaListFlag) String() string {
	return strings.Join(f.values, ",")
}
