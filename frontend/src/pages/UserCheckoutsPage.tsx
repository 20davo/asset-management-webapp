import { Navigate, useParams } from 'react-router-dom'

function UserCheckoutsPage() {
  const { userId } = useParams()
  return <Navigate to={userId ? `/users/${userId}` : '/users'} replace />
}

export default UserCheckoutsPage
