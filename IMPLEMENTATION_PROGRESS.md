# Profile dashboard + settings — implementation progress

| Step | Status | Notes |
|------|--------|-------|
| API: `avatar_url` + migration | ✅ | `e4f8a120c3d1_add_user_avatar_url.py` |
| API: `PATCH /users/me` | ✅ | `MeUpdate`, 409 on email conflict |
| API: `POST /auth/change-password` | ✅ | 204 + refreshed cookie |
| API: `DELETE /users/me` | ✅ | Handle confirmation + cascades |
| API: OpenAPI + CORS DELETE | ✅ | `authed_paths` + `allow_methods` |
| Web: login/register default `/dashboard` | ✅ | `LoginForm` / `RegisterForm` |
| Web: `api.ts` + types | ✅ | `MeUpdateInput`, `avatar_url`, `created_at` |
| Web: Avatar, ProfileHeader, SettingsTab, Dashboard | ✅ | Three tabs including Settings |
| Web: HeaderNav + `/u/[username]` | ✅ | `Avatar` wired |
| API: pytest auth + seeded users | ✅ | `login_as`, `make_item` logs in seller; offers/uploads log in buyer/seller |

**Overall: 100%**
