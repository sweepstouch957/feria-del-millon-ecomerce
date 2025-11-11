export function  StatItem({ stat }) {
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text mb-2">
        {stat.number}
        {stat.suffix}
      </div>
      <p className="text-gray-600 font-medium">{stat.label}</p>
    </div>
  );
}