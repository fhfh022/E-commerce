const ChatSkeleton = () => {
  return (
    <div className="h-[calc(100vh-64px)] bg-[#F1F5F9] flex items-center justify-center px-0 sm:px-4 py-4 md:py-8">
      <div className="flex w-full max-w-6xl h-full bg-white sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-200 relative">
        
        {/* Sidebar Skeleton */}
        <div className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="flex-1 p-2 space-y-2 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-3 rounded-xl flex gap-3 items-center">
                <div className="size-11 rounded-full bg-slate-200 flex-shrink-0 animate-pulse" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                    <div className="h-3 w-8 bg-slate-100 rounded animate-pulse" />
                  </div>
                  <div className="h-3 w-3/4 bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area Skeleton (ซ่อนใน Mobile เพื่อให้เหมือนเข้าหน้า Inbox ก่อน) */}
        <div className="hidden md:flex flex-1 flex-col bg-white relative">
          {/* Header */}
          <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-slate-200 animate-pulse" />
                <div className="space-y-1">
                    <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
                </div>
             </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-6 space-y-6 bg-[#F8FAFC]">
             <div className="flex flex-col items-start max-w-[70%]">
                <div className="h-10 w-48 bg-white border border-slate-200 rounded-2xl rounded-tl-none animate-pulse" />
             </div>
             <div className="flex flex-col items-end max-w-[70%] self-end">
                <div className="h-12 w-64 bg-indigo-100 rounded-2xl rounded-tr-none animate-pulse" />
             </div>
             <div className="flex flex-col items-start max-w-[70%]">
                <div className="h-16 w-56 bg-white border border-slate-200 rounded-2xl rounded-tl-none animate-pulse" />
             </div>
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-slate-100">
             <div className="h-12 w-full bg-slate-50 rounded-full animate-pulse border border-slate-100" />
          </div>
        </div>

      </div>
    </div>
  );
}
export default ChatSkeleton