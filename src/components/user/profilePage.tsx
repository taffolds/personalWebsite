import { useUser } from "../../contexts/UserContext.js";
import Banner from "../page/banner.js";

export function ProfilePage() {
  // Add debug if not logged in
  // Add debug to user if profile is loading
  // Add friend request options
  // Need a notification system when people add you
  // Friends list?
  // Need some GDPR to delete user from database
  // Edit username
  // Should have a logout here as well as on the hamburger

  const { profile, loading, refreshProfile } = useUser();

  if (loading) return <p>Loading profile</p>;

  if (!profile) return <p>No profile</p>;

  return (
    <>
      <Banner />
      <p>Hello, {profile.email}</p>
    </>
  );
}
