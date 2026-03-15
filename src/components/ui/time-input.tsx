"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type TimeFormat,
  to24HourFormat,
  parse24HourTo12Hour,
  parse24Hour,
  getHourOptions,
  getMinuteOptions,
} from "@/lib/time-format";

type TimeInputProps = {
  value: string; // Always stored as HH:mm (24h format)
  onChange: (value: string) => void;
  format: TimeFormat;
  placeholder?: string;
  className?: string;
};

export function TimeInput({
  value,
  onChange,
  format,
  placeholder,
  className,
}: TimeInputProps) {
  // For 12h format
  const [hour12, setHour12] = useState(12);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  // For 24h format
  const [hour24, setHour24] = useState(0);
  const [minute24, setMinute24] = useState(0);

  // Parse initial value
  useEffect(() => {
    if (!value) {
      // Reset to defaults
      if (format === "12h") {
        setHour12(12);
        setMinute(0);
        setPeriod("AM");
      } else {
        setHour24(0);
        setMinute24(0);
      }
      return;
    }

    if (format === "12h") {
      const parsed = parse24HourTo12Hour(value);
      setHour12(parsed.hour);
      setMinute(parsed.minute);
      setPeriod(parsed.period);
    } else {
      const parsed = parse24Hour(value);
      setHour24(parsed.hour);
      setMinute24(parsed.minute);
    }
  }, [value, format]);

  // Update value when parts change (12h)
  function update12h(newHour?: number, newMinute?: number, newPeriod?: "AM" | "PM") {
    const h = newHour ?? hour12;
    const m = newMinute ?? minute;
    const p = newPeriod ?? period;
    const newValue = to24HourFormat(h, m, p);
    onChange(newValue);
  }

  // Update value when parts change (24h)
  function update24h(newHour?: number, newMinute?: number) {
    const h = newHour ?? hour24;
    const m = newMinute ?? minute24;
    const newValue = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    onChange(newValue);
  }

  const hourOptions = getHourOptions(format);
  const minuteOptions = getMinuteOptions();

  if (format === "12h") {
    return (
      <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
        {/* Hour */}
        <Select
          value={hour12.toString()}
          onValueChange={(v) => {
            const newHour = parseInt(v, 10);
            setHour12(newHour);
            update12h(newHour, undefined, undefined);
          }}
        >
          <SelectTrigger className="w-16">
            <SelectValue placeholder="Hr" />
          </SelectTrigger>
          <SelectContent>
            {hourOptions.map((h) => (
              <SelectItem key={h} value={h.toString()}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-muted-foreground">:</span>

        {/* Minute */}
        <Select
          value={minute.toString()}
          onValueChange={(v) => {
            const newMinute = parseInt(v, 10);
            setMinute(newMinute);
            update12h(undefined, newMinute, undefined);
          }}
        >
          <SelectTrigger className="w-16">
            <SelectValue placeholder="Min" />
          </SelectTrigger>
          <SelectContent>
            {minuteOptions.map((m) => (
              <SelectItem key={m} value={m.toString()}>
                {m.toString().padStart(2, "0")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* AM/PM */}
        <Select
          value={period}
          onValueChange={(v: "AM" | "PM") => {
            setPeriod(v);
            update12h(undefined, undefined, v);
          }}
        >
          <SelectTrigger className="w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // 24h format
  return (
    <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
      {/* Hour */}
      <Select
        value={hour24.toString()}
        onValueChange={(v) => {
          const newHour = parseInt(v, 10);
          setHour24(newHour);
          update24h(newHour, undefined);
        }}
      >
        <SelectTrigger className="w-16">
          <SelectValue placeholder="Hr" />
        </SelectTrigger>
        <SelectContent>
          {hourOptions.map((h) => (
            <SelectItem key={h} value={h.toString()}>
              {h.toString().padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground">:</span>

      {/* Minute */}
      <Select
        value={minute24.toString()}
        onValueChange={(v) => {
          const newMinute = parseInt(v, 10);
          setMinute24(newMinute);
          update24h(undefined, newMinute);
        }}
      >
        <SelectTrigger className="w-16">
          <SelectValue placeholder="Min" />
        </SelectTrigger>
        <SelectContent>
          {minuteOptions.map((m) => (
            <SelectItem key={m} value={m.toString()}>
              {m.toString().padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}