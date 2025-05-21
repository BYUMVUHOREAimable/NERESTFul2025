export const Logo = ({ size }) => {
  return (
    <div className="flex items-center gap-2">
      <div className={`"relative" ${size}`}>
        <img src="/images/logo2.png" alt="logo" />
      </div>
    </div>
  );
};
