import jsPDF from "jspdf";
import Cookies from "js-cookie";

const token = Cookies.get("token");

const handleGoClick = (selectedMonth, setDates, setVisibleDates) => {
  if (selectedMonth) {
    const [year, month] = selectedMonth.split("-");
    const date = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const newDates = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month - 1, day);
      const dayName = currentDate.toLocaleDateString("en-US", {
        weekday: "long",
      });
      newDates.push(`${day}-${month}-${year} / ${dayName}`);
    }
    setDates(newDates);
    setVisibleDates(newDates);
  }
};

const handleMonthKeyPress = (
  event,
  handleGoClick,
  selectedMonth,
  setDates,
  setVisibleDates
) => {
  if (event.key === "Enter") {
    handleGoClick(selectedMonth, setDates, setVisibleDates);
  }
};

const handleMonthChange = (event, setSelectedMonth) => {
  setSelectedMonth(event.target.value);
};

const handleDateClick = (date, setVisibleDates) => {
  setVisibleDates((prevVisibleDates) =>
    prevVisibleDates.includes(date)
      ? prevVisibleDates.filter((d) => d !== date)
      : [...prevVisibleDates, date]
  );
};

const handleSearch = (searchQuery, usersData, setFilteredUsers) => {
  console.log("Handle serach called");
  
  const query = searchQuery.toLowerCase();
  if (query === "") {
    setFilteredUsers(usersData);
  } else {
    const filtered = usersData.filter((user) =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }
};

const handleSearchChange = (event, setSearchQuery) => {
  setSearchQuery(event.target.value);
};

const formatDate = (date) => {
  const [day, month, year] = date.split("/");
  return `${day}/${month}/${year}`;
};

const handleScrollToTop = () => {
  const container = document.getElementById("scrollable-time-report");
  if (container) {
    container.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const scrollToTopButtonDisplay = (event, setShowFab) => {
  const { scrollTop } = event.target;
  setShowFab(scrollTop > 10);
};

function parseTimeRange(timeRange, convertTo24Hour) {
  const [start, end] = timeRange.split("-");
  const [startHour, startMinute, startPeriod] = start
    .trim()
    .match(/(\d+):(\d+)\s*(AM|PM)/i)
    .slice(1);
  const [endHour, endMinute, endPeriod] = end
    .trim()
    .match(/(\d+):(\d+)\s*(AM|PM)/i)
    .slice(1);

  const startDate = new Date(
    0,
    0,
    0,
    convertTo24Hour(startHour, startPeriod),
    startMinute
  );
  const endDate = new Date(
    0,
    0,
    0,
    convertTo24Hour(endHour, endPeriod),
    endMinute
  );

  const diff = (endDate - startDate) / (1000 * 60 * 60);
  return diff;
}

function convertTo24Hour(hour, period) {
  hour = parseInt(hour, 10);
  if (period.toUpperCase() === "PM" && hour !== 12) {
    return hour + 12;
  }
  if (period.toUpperCase() === "AM" && hour === 12) {
    return 0;
  }
  return hour;
}

const fetchUsers = async (setUsersData) => {
    console.log("🔥 API CALL: fetchUsers() STARTED");
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/users`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const usersData = await response.json();
        console.log("✅ fetchUsers RESPONSE:", usersData); // <-- check this

    setUsersData(usersData);
  } catch (error) {
    console.log("Error fetching users:", error);
  }
};

const fetchTimeEntries = async (setTimeEntriesData) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/time/time-entries`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const timeEntriesData = await response.json();
     console.log("✅ fetchTimeEntries RESPONSE:", timeEntriesData);
    const formattedTimeEntriesData = timeEntriesData.map((entry) => ({
      ...entry,
      date: new Date(entry.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    }));
    setTimeEntriesData(formattedTimeEntriesData);
  } catch (error) {
    console.log("Error fetching time entries:", error);
  }
};

const generatePDF = (
  selectedMonth,
  filteredUsers,
  usersData,
  timeEntriesData,
  searchQuery
) => {
  const doc = new jsPDF();
  const filteredData = (searchQuery ? filteredUsers : usersData);
  const [selectedYear, selectedMonthValue] = selectedMonth.split("-");

  filteredData.forEach((user) => {
    const userTimeEntries = timeEntriesData.filter((entry) => {
      const [entryDay, entryMonth, entryYear] = entry.date.split("/");
      return (
        entry.employeeId === user.user_id &&
        entryMonth === selectedMonthValue &&
        entryYear === selectedYear
      );
    });

    const tableData = userTimeEntries.map((entry) => [
      formatDate(entry.date),
      entry.time
    ]);

    doc.text(`Employee Name: ${user.firstName} ${user.lastName}`, 10, 10);
    doc.text(`Employee Phone: ${user.phone || "N/A"}`, 10, 20);

    doc.autoTable({
      head: [["Date", "Time"]],
      body: tableData,
      startY: 40,
    });

    doc.addPage();
  });

  doc.save("time_report.pdf");
};

export {
  handleGoClick,
  handleMonthKeyPress,
  handleMonthChange,
  handleDateClick,
  handleSearch,
  handleSearchChange,
  formatDate,
  handleScrollToTop,
  scrollToTopButtonDisplay,
  parseTimeRange,
  convertTo24Hour,
  fetchUsers,
  fetchTimeEntries,
  generatePDF,
};
