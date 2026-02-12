export const tokens = {
    colors: {
        // Core Brand
        primary: {
            DEFAULT: "139 69% 48%", // Vibrant Green
            foreground: "0 0% 0%",
            variant: "139 69% 42%",
            glow: "139 69% 75%",
            subtle: "139 69% 48% / 0.1",
        },
        // Backgrounds - Premium Dark Mode
        background: {
            DEFAULT: "0 0% 2%",      // Deepest Black
            subtle: "0 0% 4%",       // Slightly lighter (cards)
            elevated: "0 0% 6%",     // Popovers / Dialogs
        },
        foreground: {
            DEFAULT: "0 0% 98%",
            muted: "0 0% 65%",
            subtle: "0 0% 45%",
        },
        // Functional States
        status: {
            success: "145 100% 45%",
            warning: "45 100% 50%",
            error: "0 84% 60%",
            info: "210 100% 50%",
        },
        border: {
            DEFAULT: "0 0% 12%",
            subtle: "0 0% 8%",
            active: "139 69% 48% / 0.3",
        }
    },
    borderRadius: {
        lg: "0.75rem",
        md: "calc(0.75rem - 2px)",
        sm: "calc(0.75rem - 4px)",
    },
    spacing: {
        container: "2rem",
    }
} as const;

// Helper to use tokens in standard JS if needed, though Tailwind classes are preferred
export const getToken = (path: string) => {
    // Logic to retrieve token by dot notation could go here
    return null;
};
