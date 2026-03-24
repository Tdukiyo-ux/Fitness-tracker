import { useState } from "react";
import { deleteActivity } from "../api/activities";
import { useAuth } from "../auth/AuthContext";

export default function ActivityList({ activities, token, syncActivities }) {
  const [error, setError] = useState(null);

  const tryDeleteActivity = async (id) => {
    setError(null);
    try {
      await deleteActivity(token, id);
      syncActivities();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <ul>
      {activities.map((activity) => (
        <li key={activity.id}>
          {activity.name}
          {token && (
            <button onClick={() => tryDeleteActivity(activity.id)}>
              Delete
            </button>
          )}
        </li>
      ))}
      {error && <p role="alert">{error}</p>}
    </ul>
  );
}