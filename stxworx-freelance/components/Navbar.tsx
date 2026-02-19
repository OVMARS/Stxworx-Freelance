import logo from "../assets/STXWORX_LOGO_FINAL_3d_cropped.png";

// ... existing code above the logo div ...

<div className="flex items-center cursor-pointer shrink-0" onClick={() => onNavigate('home')}>
    <img src={logo} alt="STXWORX Logo" className="h-10 md:h-16 w-auto object-contain" />
</div>

// ... existing code below logo div ...