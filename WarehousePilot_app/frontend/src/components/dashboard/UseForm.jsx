import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useNavigate, useParams } from "react-router-dom";
import Modal from "./Modal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const generatePassword = () => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';
  const allChars = lowercase + uppercase + numbers + symbols;
  
  const length = Math.floor(Math.random() * 9) + 8; // 8-16 characters
  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);
  
  let password = [
    lowercase[array[0] % lowercase.length],
    uppercase[array[1] % uppercase.length],
    numbers[array[2] % numbers.length],
    symbols[array[3] % symbols.length]
  ];
  
  for (let i = 4; i < length; i++) {
    password.push(allChars[array[i] % allChars.length]);
  }
  
  return password.sort(() => Math.random() - 0.5).join('');
};

export default function UserForm() {
  const [username, setUsername] = useState("");
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [date_of_hire, setDateOfHire] = useState("");
  const [feedback, setFeedback] = useState("Message");
  const [showModal, setShowModal] = useState(false);
  const [LinkToPage, setLinkToPage] = useState("");
  const [header, setHeader] = useState("");

  const navigate = useNavigate();
  const { user_id } = useParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const handleGeneratePassword = () => {
    setPassword(generatePassword());
  };

  const typesOfUsers = ["Admin", "Manager", "Staff", "QA"];
  const today = new Date();
  // const minDate = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate()).toISOString().split('T')[0];
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
            `${API_BASE_URL}/admin_dashboard/edit_user/${user_id}/`,
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
            setDateOfHire(userData.date_of_hire ? userData.date_of_hire.split("T")[0] : "");
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
  
    // Validate date of hire (user must be at least 14 years old)
    if (date_of_hire > today) {
      setFeedback("The staff's hire date cannot be in the future. Please adjust the date of hire accordingly.");
      setHeader("Error"); // Set the header to "Error" for invalid date of hire
      setShowModal(true);
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
        date_of_hire,
      };
  
      if (!isEditMode) {
        userData.password = password; // Add password for new users
      }
  
      const url = isEditMode
        ? `${API_BASE_URL}/admin_dashboard/edit_user/${user_id}/`
        : `${API_BASE_URL}/admin_dashboard/add_user/`;
  
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
  
      // On success, set feedback and header to "Success"
      setFeedback(`User has been ${isEditMode ? "updated" : "added"} successfully. You will now be redirected to the users page.`);
      setHeader("Success"); // Success message
      setShowModal(true);
      setLinkToPage("/admin_dashboard/manage_users");
    } catch (error) {
      // On error, set feedback and header to "Error"
      console.error("Submission failed:", error.response?.data || error.message);
      setFeedback(`Failed to ${isEditMode ? "update" : "add"} user. Please try again.`);
      setHeader("Error");
      setShowModal(true);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 dark:text-white">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Profile Picture Section */}
        <div className="max-w-60 lg:w-1/3 p-4 md:p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800">
          <div className="flex flex-col items-center justify-center space-y-4">
            <UserCircleIcon className="text-gray-300 md:size-32" aria-hidden="true" />
            <label htmlFor="photo" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
              Profile Picture
            </label>
          </div>
        </div>

        {/* Form Fields Section */}
        <div className="w-full lg:w-2/3 p-4 md:p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditMode ? "Edit user" : "Add new user"}
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Enter the staff member's information below
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="First name" value={first_name} onChange={(e) => setFirstName(e.target.value)} />
              <InputField label="Last name" value={last_name} onChange={(e) => setLastName(e.target.value)} />
              <InputField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <InputField label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              
              {!isEditMode && (
                <div className="relative">
                  <InputField
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-7 text-sm text-black dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-400"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                  <div className="mt-1 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-sm text-black dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-400"
                    >
                      Generate Password
                    </button>
                  </div>
                </div>
              )}
              
              <InputField label="Date Of Hire" type="date" value={date_of_hire} onChange={(e) => setDateOfHire(e.target.value)} minValue={today}/>
              <InputField label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
              <Dropdown label="Role" options={typesOfUsers} value={role} required={true} onChange={(e) => setRole(e.target.value)} />
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="w-full md:w-auto rounded-md bg-black dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 dark:hover:bg-gray-600 transition-colors"
              >
                {isEditMode ? "Update Staff" : "Add Staff"}
              </button>

              <Modal
                show={showModal}
                onClose={() => setShowModal(false)}
                header={header}
                body={feedback}
                LinkTo={LinkToPage}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function InputField({ label, type = "text", value, onChange, minValue }) {
  return (
    <div>
      <label htmlFor={label.toLowerCase().replace(" ", "-")} className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        id={label.toLowerCase().replace(" ", "-")}
        type={type}
        placeholder={`Enter ${label}`}
        value={value}
        onChange={onChange}
        min={minValue}
        className="block w-full rounded-md outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-600 border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm dark:bg-gray-700 dark:text-white"
      />
    </div>
  );
}

function Dropdown({ label, options, value, onChange }) {
  return (
    <div>
      <label htmlFor={label.toLowerCase()} className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
        {label}
      </label>
      <select
        id={label.toLowerCase()}
        value={value}
        onChange={onChange}
        className="block w-full rounded-md outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-600 border-gray-300 shadow-sm px-3 py-2 appearance-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm dark:bg-gray-700 dark:text-white"
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
