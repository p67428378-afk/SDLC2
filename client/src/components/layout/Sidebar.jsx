import React from "react";

export default function Sidebar({ currentPage, setCurrentPage }) {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[260px] bg-surface-container border-r border-outline-variant flex-col p-md z-20">
      <div className="flex items-center gap-3 mb-xl">
        <img
          alt="Chronos Logo"
          className="w-8 h-8 rounded-lg object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuADP96rNPlMIFSkPlMxWG9MRzwMfn8ofI0p74DxmtOF9NOftHvls5NmQT9VPXDuYw62MGH7ZQZX3kceAgexFbwVgHrWG4Z_LiaYUq6zbJCZLJiKaC9dl1HqyWOGAvZZlgQeC1etUuJx6K6Di4t-L16mnFKu_X51l357y-Nz7er54k8KESM_apwK2Q3wTsg4hP4eTHYbnwWXZwqLwTD9EmFMxatj8Zbc0vuNGXfDlHpIMYgjKFwUce8vy_Xw4DnIRNAtffg46fdFtQ8"
        />
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            Chronos
          </h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Time Tracking
          </p>
        </div>
      </div>
      <nav className="flex-1 space-y-sm">
        <a
          onClick={(e) => {
            e.preventDefault();
            setCurrentPage("dashboard");
          }}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 ${
            currentPage === "dashboard"
              ? "bg-primary-container text-on-primary-container font-bold scale-95 origin-left shadow-[inset_4px_0_0_0_#4edea3]"
              : "text-on-surface-variant hover:text-on-surface hover:bg-secondary-container"
          }`}
          href="#"
        >
          <span className="material-symbols-outlined filled">dashboard</span>
          Dashboard
        </a>
        <a
          onClick={(e) => e.preventDefault()}
          className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-secondary-container transition-colors rounded-lg opacity-50 cursor-not-allowed"
          href="#"
        >
          <span className="material-symbols-outlined">history</span>
          History
        </a>
        <a
          onClick={(e) => e.preventDefault()}
          className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-secondary-container transition-colors rounded-lg opacity-50 cursor-not-allowed"
          href="#"
        >
          <span className="material-symbols-outlined">analytics</span>
          Analytics
        </a>
        <a
          onClick={(e) => {
            e.preventDefault();
            setCurrentPage("settings");
          }}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 ${
            currentPage === "settings"
              ? "bg-primary-container text-on-primary-container font-bold scale-95 origin-left shadow-[inset_4px_0_0_0_#4edea3]"
              : "text-on-surface-variant hover:text-on-surface hover:bg-secondary-container"
          }`}
          href="#"
        >
          <span className="material-symbols-outlined">settings</span>
          Settings
        </a>
      </nav>
      <div className="mt-auto border-t border-outline-variant pt-md flex items-center gap-3 hover:bg-secondary-container p-2 rounded-lg cursor-pointer transition-colors">
        <img
          className="w-10 h-10 rounded-full object-cover"
          alt="Alex Mercer"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1WvaXLoRZGVVVH3iED30faj_xIg2MwJgtreZrJVlTBA8GtmFzgc_yFh3zK-RWABMSAWQnYm-_rGMp3507rVD10TWjVyQHDr-KNCIm2RiEuUcpsNqspujBbgLjUYXMgYcdKwjIHjzABxA8T5s66UXMVxdxgtLbECMmlGYoEoPYV68shFUpEZWy0DmKHzqKCMGyomAU-KjoIHsBf8-8CTJ4c-mfXfxlUFO1QsUyyUaEgjFPeTbgimU-OGwW8UFNkr9DnQ5sWLn1-4w"
        />
        <div>
          <p className="font-label-md text-label-md text-on-surface">
            Alex Mercer
          </p>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Software Engineer
          </p>
        </div>
      </div>
    </aside>
  );
}
