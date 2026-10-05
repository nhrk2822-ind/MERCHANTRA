import React from "react";
import Sidebar from "./Sidebar.jsx";
import TopBar from "./TopBar.jsx";

export default function Layout({ title, children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7fa] text-slate-900">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={title} />

        <main className="min-h-0 flex-1 overflow-y-auto bg-[#f4f7fa]">
          <div className="mx-auto w-full max-w-[1700px] p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}