import { UserAvatar } from '../UserAvatar'

export default function UserAvatarExample() {
  return (
    <div className="flex items-center gap-4">
      <UserAvatar name="Иван Петров" size="sm" />
      <UserAvatar name="Мария Сидорова" size="md" />
      <UserAvatar name="Алексей Иванов" size="lg" />
    </div>
  )
}
