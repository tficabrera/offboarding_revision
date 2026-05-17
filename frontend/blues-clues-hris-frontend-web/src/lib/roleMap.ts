export function roleToPath(roleName?: string) {
  switch (roleName) {
    case "System Admin":
      return "/system-admin";
    case "Admin":
      return "/admin";
    case "HR Officer":
    case "HR Recruiter":
    case "HR Interviewer":
      return "/hr";
    case "Active Employee":
    case "Employee":
    case "Staff":
      return "/employee";
    case "Applicant":
      return "/applicant";
    case "Manager":
    case "Group Head":
      return "/manager";
    default:
      return "/login";
  }
}
