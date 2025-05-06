import React from "react"

export default function CalendarRow() {
  const today = new Date("2025-05-04").toISOString().split("T")[0]

  const days = [
    { day: 1, label: "sarbatoare", type: "sarbatoare", date: "2025-05-01" },
    { day: 2, label: "curs", type: "curs", date: "2025-05-02" },
    { day: 3, label: "curs", type: "curs", date: "2025-05-03" },
    { day: 4, label: "curs", type: "curs", date: "2025-05-04" },
    { day: 5, label: "vacanta", type: "vacanta", date: "2025-05-05" },
    { day: 6, label: "vacanta", type: "vacanta", date: "2025-05-06" },
    { day: 7, label: "final8", type: "final8", date: "2025-05-07" },
    { day: 8, label: "final12", type: "final12", date: "2025-05-08" },
  ]

  const typeColors = {
    curs: "bg-white text-gray-800 border-gray-300",
    vacanta: "bg-green-100 text-green-800 border-green-300",
    vacanta_optional: "bg-green-50 text-green-600 border-green-200",
    final12: "bg-yellow-100 text-yellow-800 border-yellow-300",
    final8: "bg-orange-100 text-orange-800 border-orange-300",
    sarbatoare: "bg-blue-100 text-blue-800 border-blue-300",
  }

  return (
    <div className="grid grid-cols-8 gap-4 p-4 bg-gray-50 rounded-xl">
      {days.map(({ day, label, type, date }) => {
        const isToday = date === today
        return (
          <div
            key={date}
            className="flex flex-col items-center text-xs gap-1"
          >
            <div
              className={[
                "w-10 h-10 rounded-lg flex items-center justify-center border shadow transition-all duration-200",
                typeColors[type] || "bg-white text-gray-800 border-gray-300",
                isToday ? "ring-2 ring-red-400 scale-105 font-bold" : ""
              ].join(" ")}
            >
              {day}
            </div>
            <div className="text-[10px] text-center text-gray-500 font-medium max-w-[40px]">
              {label}
            </div>
          </div>
        )
      })}
    </div>
  )
}
