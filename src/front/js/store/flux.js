const getState = ({ getStore, getActions, setStore }) => {
    return {
        store: {
            message: null,
           
        },
        actions: {
            exampleFunction: () => {
                getActions().changeColor(0, "green");
            },
loginUser: (user, token) => {
				const store = getStore();
				setStore({
					...store,
					user: user,
					token: token
				});
			},
	

            

            
        }
    };
};

export default getState;
