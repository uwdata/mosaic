package query

import (
	"context"
	"database/sql"
	"database/sql/driver"

	"github.com/apache/arrow-go/v18/arrow/ipc"
	"github.com/duckdb/duckdb-go/v2"
)

func (p *PreAggregator) measure(ctx context.Context, conn *sql.Conn, ref preAggregateRef) (int64, int64, error) {
	var rows int64
	size := &preAggregateSize{limit: p.limits.MaxBytes}
	err := conn.Raw(func(raw any) error {
		arrow, err := duckdb.NewArrowFromConn(raw.(driver.Conn))
		if err != nil {
			return err
		}
		rdr, err := arrow.QueryContext(ctx, "SELECT * FROM "+ref.String())
		if err != nil {
			return err
		}
		defer rdr.Release()
		writer := ipc.NewWriter(size, ipc.WithSchema(rdr.Schema()))
		defer func() { _ = writer.Close() }()
		for rdr.Next() {
			rows += rdr.RecordBatch().NumRows()
			if rows > p.limits.MaxRows {
				return ErrPreAggregateLimit
			}
			if err := writer.Write(rdr.RecordBatch()); err != nil {
				return err
			}
		}
		if err := rdr.Err(); err != nil {
			return err
		}
		return writer.Close()
	})
	return rows, size.bytes, err
}

type preAggregateSize struct {
	bytes int64
	limit int64
}

func (w *preAggregateSize) Write(data []byte) (int, error) {
	if int64(len(data)) > w.limit-w.bytes {
		return 0, ErrPreAggregateLimit
	}
	w.bytes += int64(len(data))
	return len(data), nil
}
