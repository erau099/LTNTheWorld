import { useState } from "react";

function AdminUserManagement() {
const [users, setUsers] = useState([
        {
            id: 1,
            name: "Test Donor",
            email: "donor@example.com",
            role: "Donor",
            status: "Active",
        },
        {
            id: 2,
            name: "Test Receiver",
            email: "receiver@example.com",
            role: "Receiver",
            status: "Active",
        },
        {
            id: 3,
            name: "Reported User",
            email: "reported@example.com",
            role: "Donor",
            status: "Flagged",
        },
        {
            id: 4,
            name: "Suspended User",
            email: "suspended@example.com",
            role: "Receiver",
            status: "Suspended",
        },
        {
            id: 5,
            name: "John Smith",
            email: "johnsmith@example.com",
            role: "Donor",
            status: "Active",
        },
        {
            id: 6,
            name: "Maria Lopez",
            email: "maria@example.com",
            role: "Receiver",
            status: "Active",
        },
    ]);

  const handleStatusChange = (id) => {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === id
          ? {
              ...user,
              status: user.status === "Active" ? "Suspended" : "Active",
            }
          : user
      )
    );
  };

  return (
    <section className="admin-user-management">
      <div className="admin-section-header">
        <h2>User Management</h2>
        <p>Review and manage platform users.</p>
      </div>

      <div className="admin-user-table">
        <div className="admin-user-row admin-user-table-header">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {users.map((user) => (
          <div className="admin-user-row" key={user.id}>
            <span>{user.name}</span>
            <span>{user.email}</span>
            <span>{user.role}</span>
            <span>{user.status}</span>

            <span>
              <button
                className="admin-user-action"
                onClick={() => handleStatusChange(user.id)}
              >
                {user.status === "Active" ? "Suspend" : "Activate"}
              </button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default AdminUserManagement;