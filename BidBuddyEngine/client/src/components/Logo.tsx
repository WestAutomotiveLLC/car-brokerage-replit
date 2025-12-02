export function Logo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-blue-gradient flex items-center justify-center shadow-lg ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-3/5 h-3/5"
      >
        <path
          d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="white"
          fillOpacity="0.2"
        />
        <path
          d="M12 12L2 7M12 12L22 7M12 12V22"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
