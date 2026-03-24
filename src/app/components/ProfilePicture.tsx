import { useState } from "react";
import { User } from "lucide-react";

interface ProfilePictureProps {
  darkMode?: boolean;
  size?: "small" | "medium" | "large";
  editable?: boolean;
}

export function ProfilePicture({ 
  darkMode = false, 
  size = "medium",
  editable = false 
}: ProfilePictureProps) {
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-24 h-24", 
    large: "w-32 h-32"
  };

  const iconSizes = {
    small: 24,
    medium: 48,
    large: 64
  };

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
        setShowPhotoOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePicture(null);
    setShowPhotoOptions(false);
  };

  return (
    <div className="flex flex-col items-center">
      <div
        onClick={() => editable && setShowPhotoOptions(!showPhotoOptions)}
        className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white overflow-hidden ${
          editable ? 'hover:opacity-90 transition-opacity cursor-pointer' : ''
        }`}
      >
        {profilePicture ? (
          <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <User size={iconSizes[size]} />
        )}
      </div>

      {editable && (
        <div className="mt-2">
          <input
            ref={(ref) => {
              if (ref && showPhotoOptions) {
                ref.click();
              }
            }}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleProfilePictureUpload}
          />
        </div>
      )}
    </div>
  );
}
