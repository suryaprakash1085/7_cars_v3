import React from 'react';

export default function Popup({ onClose, data }) {
  // Check if data is an array and not empty
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div style={styles.overlay}>
        <div style={styles.popup}>
          <button onClick={onClose} style={styles.closeButton}>Close</button>
          <h2>No Data Available</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.popup}>
        {/* Close Button */}
        <button onClick={onClose} style={styles.closeButton}>Close</button>
        <h2>Popup with Table</h2>

        {/* Table */}
        <table border="1" style={styles.table}>
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Customer Name</th>
              <th>Phone</th>
              <th>Type</th>
              <th>City</th>
            </tr>
          </thead>
          <tbody>
            {data.map((customer) => (
              <tr key={customer.customer_id}>
                <td>{customer.customer_id}</td>
                <td>{customer.customer_name}</td>
                <td>{customer.phone}</td>
                <td>{customer.type}</td>
                <td>{customer.city}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    padding: '5px 10px',
    backgroundColor: 'red',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    marginTop: '20px',
    borderCollapse: 'collapse',
  },
};
