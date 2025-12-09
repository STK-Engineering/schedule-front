import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList } from "react-native";
import { Calendar } from "react-native-calendars";

export default function CalendarEventScreen() {
  const [selectedDate, setSelectedDate] = useState();
  const [eventText, setEventText] = useState("");
  const [events, setEvents] = useState({}); 

  const addEvent = () => {
    if (!selectedDate || !eventText.trim()) return;

    setEvents((prev) => {
      const updated = {
        ...prev,
        [selectedDate]: [...(prev[selectedDate] || []), eventText],
      };
      return updated;
    });
    setEventText("");
  };

  const markedDates = Object.keys(events).reduce((acc, date) => {
    acc[date] = { marked: true, dotColor: "red" };
    return acc;
  }, {});

  if (selectedDate) {
    markedDates[selectedDate] = {
      ...(markedDates[selectedDate] || {}),
      selected: true,
      selectedColor: "#70c7ff",
    };
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
      />
      </View>
  );
}
