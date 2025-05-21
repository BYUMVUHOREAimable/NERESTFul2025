import { useQuery } from "react-query"
import { Navigate } from "react-router-dom"
import { getUserProfile } from "../api/users"
import { ProfileForm } from "../components/profile/profile-form"
import { Loader } from "../components/ui/loader"

export const ProfilePage = () => {
  const { data: user, isLoading, isError } = useQuery("userProfile", getUserProfile)

  if (isLoading) {
    return <Loader />
  }

  if (isError) {
    return <Navigate to="/login" />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>
        <ProfileForm user={user} />
      </div>
    </div>
  )
}
