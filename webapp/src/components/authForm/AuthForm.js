import React from "react";

function AuthForm(){
    const [showLogin, setShowLogin] = useState(true);
    
      const handleToggleView = () => {
        setShowLogin(!showLogin);
      };

      
}

export default AuthForm;