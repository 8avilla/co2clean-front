interface CompanyAvatarProps {
  name: string;
  logoUrl?: string;
}

// Plain <img>: logos come from external blob storage with unknown dimensions
export const CompanyAvatar = ({ name, logoUrl }: CompanyAvatarProps) => (
  <div
    className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold overflow-hidden border border-teal-100 flex-shrink-0"
    aria-hidden={logoUrl ? undefined : true}
  >
    {logoUrl ? (
      <img src={logoUrl} alt={`Logo de ${name}`} className="w-full h-full object-contain p-1" />
    ) : (
      name.charAt(0).toUpperCase()
    )}
  </div>
);
