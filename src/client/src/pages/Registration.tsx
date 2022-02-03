import React from 'react';
import { RegistrationForm } from '../components/RegistrationForm';
import { createUser } from '../services/userService';

export const Registration: React.FC = () => {
    return (
        <div>
            <RegistrationForm createUser={createUser} />
        </div>
    );
};