export default function Template({ children }: { children: React.ReactNode }) {
  // Re-mounts on every navigation → screens push in with a slide transition
  return <div className="screen">{children}</div>;
}
