import "./style.css";

interface StatTrackerProps {
  farms: number, locations: number, users: number
}

export default function StatTracker({ farms, locations, users}:StatTrackerProps){
  return (
    <div className="StatTracker">
      <h6 className="text-muted">BerryFarmer API</h6>
      <p className="text-muted">Serving {users} users with {farms} farms in {locations} locations.</p>
    </div>
  )
}