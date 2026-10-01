import { Button } from '@/components/ui/button'
import { updateUserRole } from '@/app/admin/actions'
import { ROLES, type GuildUser } from '@/lib/auth/users'

const ROLE_LABELS: Record<GuildUser['role'], string> = {
  pending: 'Pendiente',
  member: 'Miembro',
  staff: 'Staff',
  admin: 'Administrador',
}

export function UserRoleRow({ user, isSelf }: { user: GuildUser; isSelf: boolean }) {
  const selectId = `role-${user.discord_user_id}`

  return (
    <li className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-medium">
          {user.username}
          {isSelf ? <span className="ml-2 text-xs text-violet-300">(tú)</span> : null}
        </p>
        <p className="truncate text-xs text-muted-foreground">ID de Discord: {user.discord_user_id}</p>
        <p className="mt-1 text-xs text-muted-foreground">Rol actual: {ROLE_LABELS[user.role]}</p>
      </div>

      {isSelf ? (
        <p className="text-xs text-muted-foreground">No puedes cambiar tu propio rol.</p>
      ) : (
        <form action={updateUserRole} className="flex items-center gap-2">
          <input type="hidden" name="discordUserId" value={user.discord_user_id} />
          <label htmlFor={selectId} className="sr-only">
            Rol de {user.username}
          </label>
          <select
            id={selectId}
            name="role"
            defaultValue={user.role === 'pending' ? 'member' : user.role}
            className="h-9 rounded-md border border-white/10 bg-background px-3 text-sm text-foreground"
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm">
            {user.role === 'pending' ? 'Aprobar' : 'Guardar'}
          </Button>
        </form>
      )}
    </li>
  )
}
