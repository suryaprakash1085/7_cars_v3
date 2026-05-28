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

const fetchWorkSchedule = async (setWorkScheduleData) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/workschedule`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch work schedule");
    }
    const workScheduleData = await response.json();
    setWorkScheduleData(workScheduleData);
  } catch (error) {
    console.log("Error fetching work schedule:", error);
  }
};

const fetchReportData = async (setReportData) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/workschedule/report/work_report`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch report data");
    }
    const reportData = await response.json();
    setReportData(reportData);
    // console.log('response', reportData)
  } catch (error) {
    console.log("Error fetching report data:", error);
  }
};

const fetchUsers = async (setUsersData) => {
  console.log("API CALL: fetchUsers API called"); 
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
    setUsersData(usersData);
    // console.log(usersData)
  } catch (error) {
    console.log("Error fetching users:", error);
  }
};

const fetchTimeEntries = async (setTimeEntriesData) => {
    console.log("API CALL: fetchTimeEntries API called"); // ← ADD THIS

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
  reportData,
  filteredUsers,
  usersData,
  timeEntriesData,
  searchQuery,
  convertTo24Hour
) => {
  const doc = new jsPDF();
  const filteredData = (searchQuery ? filteredUsers : usersData).filter(
    (user) => user.shift_type !== null
  );
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

    const userReport = reportData.find(
      (report) => report.user_id === user.user_id
    );
    const employeeShift = userReport?.description || "----";

    const userReportTime = userReport?.time || "----";
    // console.log(userReport?.description)
    const tableData = userTimeEntries.map((entry) => {
      const status = entry.time.includes("Leave")
        ? "Leave"
        : (() => {
            const scheduledTime = parseTimeRange(
              userReport?.time || "0:00 AM - 0:00 AM",
              convertTo24Hour
            );
            const actualTime = parseTimeRange(entry.time, convertTo24Hour);
            return actualTime >= scheduledTime ? "On Time" : "Late";
          })();

      return [
        formatDate(entry.date),
        employeeShift,
        userReportTime,
        entry.time,
        status,
      ];
    });

    doc.text(`Employee Name: ${user.firstName} ${user.lastName}`, 10, 10);
    doc.text(`Employee Phone: ${user.phone || "N/A"}`, 10, 20);

    doc.autoTable({
      head: [["Date", "Description", "Scheduled Time", "Time", "Status"]],
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
  fetchWorkSchedule,
  fetchReportData,
  fetchUsers,
  fetchTimeEntries,
  generatePDF,
};
