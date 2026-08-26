import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Clock, CheckSquare, FolderKanban, LogOut, User } from "lucide-react";

export default function Navbar() {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left brand & nav links */}
          <div className="flex items-center space-x-8">
            <Link
              to="/"
              className="flex items-center space-x-2 text-primary font-bold text-xl tracking-tight"
            >
              <Clock className="w-6 h-6 text-primary" />
              <span>TimeTrack</span>
            </Link>

            {user && (
              <div className="hidden md:flex space-x-4">
                <Link
                  to="/employee"
                  className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/employee")
                      ? "bg-blue-50 text-primary font-semibold"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Clock className="w-4 h-4 mr-1.5" />
                  My Timesheets
                </Link>

                {isManager && (
                  <>
                    <Link
                      to="/manager"
                      className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive("/manager")
                          ? "bg-blue-50 text-primary font-semibold"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <CheckSquare className="w-4 h-4 mr-1.5" />
                      Approvals
                    </Link>
                    <Link
                      to="/manager/projects"
                      className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive("/manager/projects")
                          ? "bg-blue-50 text-primary font-semibold"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <FolderKanban className="w-4 h-4 mr-1.5" />
                      Projects & Analytics
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right user context & logout */}
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-primary flex items-center justify-center font-semibold">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden sm:block">
                  <div className="font-medium text-gray-900 text-xs">
                    {user.email}
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                      isManager
                        ? "bg-purple-100 text-purple-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
