import { db } from "@/lib/db";
import { labs } from "@/lib/db/schema";
import { TrackerClient } from "./tracker-client";

export const metadata = {
  title: "My Tracker | LabRecon",
};

export default function TrackerPage() {
  // Only select fields the client needs — avoids Date serialization issues
  const allLabs = db
    .select({
      id: labs.id,
      piName: labs.piName,
      department: labs.department,
      college: labs.college,
      labName: labs.labName,
    })
    .from(labs)
    .all();

  return <TrackerClient allLabs={allLabs} />;
}
