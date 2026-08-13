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

type repeatedStringFlag struct {
	values []string
}

func (f *repeatedStringFlag) Set(value string) error {
	f.values = append(f.values, value)
	return nil
}

func (f *repeatedStringFlag) String() string {
	return strings.Join(f.values, ",")
}
