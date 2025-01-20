import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useNavigate, useParams } from "react-router-dom";
import Modal from "./Modal";

export default function UserForm() {
  const [username, setUsername] = useState("");
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [dob, setDob] = useState("");
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();
  const { user_id } = useParams();
  const [isEditMode, setIsEditMode] = useState(false);

  const typesOfUsers = ["Admin", "Manager", "Staff", "QA"];

    // Check that the user is an admin (only admins should be able to navigate to this page and add users)
    useEffect(() => {
      const user = localStorage.getItem("user");
      if (user) {
        const parsedUser = JSON.parse(user);
        if (parsedUser.role != "admin") {
          // Navigate to correct dashboard
          if (parsedUser.role == "manager") {
            navigate("/manager_dashboard");
          } else {
            navigate("/dashboard");
          }
        }
      } else {
        alert("Not logged in");
        navigate("/");
      }
    }, [navigate]);
    
  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      if (user_id) {
        try {
          const response = await axios.get(
            `http://127.0.0.1:8000/admin_dashboard/edit_user/${user_id}/`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          if (isMounted) {
            const userData = response.data;
            setIsEditMode(true);
            setUsername(userData.username || "");
            setFirstName(userData.first_name || "");
            setLastName(userData.last_name || "");
            setEmail(userData.email || "");
            setDepartment(userData.department || "");
            setRole(userData.role || "");
            setDob(userData.dob ? userData.dob.split("T")[0] : "");
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error.response?.data || error.message);
          if (isMounted) {
            alert("Failed to fetch user data. Please try again.");
          }
        }
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [user_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      alert("No token found. Please log in again.");
      navigate("/");
      return;
    }

    try {
      const userData = {
        username,
        first_name,
        last_name,
        email,
        department,
        role,
        dob,
      };

      if (!isEditMode) {
        userData.password = password;
      }

      const url = isEditMode
        ? `http://127.0.0.1:8000/admin_dashboard/edit_user/${user_id}/`
        : "http://127.0.0.1:8000/admin_dashboard/add_user/";

      const method = isEditMode ? "put" : "post";

      const response = await axios({
        method,
        url,
        data: userData,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setShowModal(true);
      navigate("/admin_dashboard/manage_users");
    } catch (error) {
      console.error("Submission failed:", error.response?.data || error.message);
      alert(`Couldn't ${isEditMode ? "update" : "add"} user`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="max-w-60 lg:w-1/3 p-4 md:p-6 border-2 border-grey-500/50 rounded-lg">
          <div className="flex flex-col items-center justify-center space-y-4">
            <UserCircleIcon className="text-gray-300 md:size-32" aria-hidden="true" />
            <label htmlFor="photo" className="block text-sm font-medium text-gray-900">
              Profile Picture
            </label>
          </div>
        </div>

        <div className="w-full lg:w-2/3 p-4 md:p-6 border-2 border-grey-500/50 rounded-lg">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditMode ? "Edit user" : "Add new user"}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Enter the staff member's information below
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="First name" value={first_name} onChange={(e) => setFirstName(e.target.value)} />
              <InputField label="Last name" value={last_name} onChange={(e) => setLastName(e.target.value)} />
              <InputField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <InputField label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              {!isEditMode && (
                <InputField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
              <InputField label="DOB" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              <InputField label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
              <Dropdown label="Role" options={typesOfUsers} value={role} onChange={(e) => setRole(e.target.value)} />
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="w-full md:w-auto rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-colors"
              >
                {isEditMode ? "Update Staff" : "Add Staff"}
              </button>

              {showModal && (
                <Modal
                  header="Success"
                  body={`User has been ${isEditMode ? "updated" : "added"} successfully.`}
                  LinkTo="/admin_dashboard/manage_users"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function InputField({ label, type = "text", value, onChange }) {
  return (
    <div>
      <label htmlFor={label.toLowerCase().replace(" ", "-")} className="block text-sm font-medium text-gray-900 mb-1">
        {label}
      </label>
      <input
        id={label.toLowerCase().replace(" ", "-")}
        type={type}
        placeholder={`Enter ${label}`}
        value={value}
        onChange={onChange}
        className="block w-full rounded-md outline outline-1 -outline-offset-1 outline-gray-300 border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm"
      />
    </div>
  );
}

function Dropdown({ label, options, value, onChange }) {
  return (
    <div>
      <label htmlFor={label.toLowerCase()} className="block text-sm font-medium text-gray-900 mb-1">
        {label}
      </label>
      <select
        id={label.toLowerCase()}
        value={value}
        onChange={onChange}
        className="block w-full rounded-md outline outline-1 -outline-offset-1 outline-gray-300 border-gray-300 shadow-sm px-3 py-2 appearance-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm"
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option} value={option.toLowerCase()}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
