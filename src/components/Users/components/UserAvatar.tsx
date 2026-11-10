import { getAvatarColor, getInitials } from '../utils/user-list.utils';

export const UserAvatar = ({ name }: { name: string }) => (
  <div
    aria-hidden="true"
    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${getAvatarColor(name)}`}
  >
    {getInitials(name)}
  </div>
);
