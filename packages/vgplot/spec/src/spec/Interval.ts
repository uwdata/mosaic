/** Date/time interval. */
export type IntervalTransform =
  | Years
  | Months
  | Days
  | Hours
  | Minutes
  | Seconds
  | Milliseconds
  | Microseconds
  ;

/** A date/time interval in units of years. */
export interface Years {
  /**
   * A date/time interval in units of years.
   */
  years: number;
}

/** A date/time interval in units of months. */
export interface Months {
  /**
   * A date/time interval in units of months.
   */
  months: number;
}

/** A date/time interval in units of days. */
export interface Days {
  /**
   * A date/time interval in units of days.
   */
  days: number;
}

/** A date/time interval in units of hours. */
export interface Hours {
  /**
   * A date/time interval in units of hours.
   */
  hours: number;
}

/** A date/time interval in units of minutes. */
export interface Minutes {
  /**
   * A date/time interval in units of minutes.
   */
  minutes: number;
}

/** A date/time interval in units of seconds. */
export interface Seconds {
  /**
   * A date/time interval in units of seconds.
   */
  seconds: number;
}

/** A date/time interval in units of milliseconds. */
export interface Milliseconds {
  /**
   * A date/time interval in units of milliseconds.
   */
  milliseconds: number;
}

/** A date/time interval in units of microseconds. */
export interface Microseconds {
  /**
   * A date/time interval in units of microseconds.
   */
  microseconds: number;
}
