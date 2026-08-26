import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Clock,
  User,
  LogOut,
  CheckSquare,
  FolderGit2,
  Calendar,
} from "lucide-react";

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
    <header className="bg-white border-b border-[#e3e8f0] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2 text-[#2663eb] font-bold text-xl tracking-tight"
            >
              <Clock className="w-6 h-6 text-[#2663eb]" />
              <span>TimeTrack Pro</span>
            </Link>

            {user && (
              <nav className="hidden md:flex items-center gap-4">
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/dashboard")
                      ? "bg-[#2663eb]/10 text-[#2663eb]"
                      : "text-[#707a8c] hover:text-[#171c29] hover:bg-gray-100"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Weekly Timesheet</span>
                </Link>

                {isManager && (
                  <>
                    <Link
                      to="/manager/dashboard"
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive("/manager/dashboard")
                          ? "bg-[#2663eb]/10 text-[#2663eb]"
                          : "text-[#707a8c] hover:text-[#171c29] hover:bg-gray-100"
                      }`}
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>Pending Approvals</span>
                    </Link>

                    <Link
                      to="/manager/projects"
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive("/manager/projects")
                          ? "bg-[#2663eb]/10 text-[#2663eb]"
                          : "text-[#707a8c] hover:text-[#171c29] hover:bg-gray-100"
                      }`}
                    >
                      <FolderGit2 className="w-4 h-4" />
                      <span>Projects</span>
                    </Link>
                  </>
                )}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#2663eb]/10 flex items-center justify-center text-[#2663eb]">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold text-[#171c29]">
                      {user.email}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#707a8c]">
                      {user.role}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isManager
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-[#2663eb] hover:text-[#1d4ed8] px-3 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium text-white bg-[#2663eb] hover:bg-[#1d4ed8] px-4 py-2 rounded-md shadow-sm transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
