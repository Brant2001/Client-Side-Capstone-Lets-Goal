import React, { useState, useEffect, createContext } from "react";
import { Spinner } from "reactstrap";
import * as firebase from "firebase/app";
import "firebase/auth";
import { useHistory } from "react-router-dom";

export const UserProfileContext = createContext();

export function UserProfileProvider(props) {
    const apiUrl = "/api/userprofile";
    const history = useHistory();
    const userProfile = localStorage.getItem("userProfile");
    const [isLoggedIn, setIsLoggedIn] = useState(userProfile != null);

    const [isFirebaseReady, setIsFirebaseReady] = useState(false);

    useEffect(() => {
        firebase.auth().onAuthStateChanged((u) => {
            setIsLoggedIn(!!u);
            setIsFirebaseReady(true);
        });
    }, []);

    const login = (email, pw) => {
        return firebase.auth().signInWithEmailAndPassword(email, pw)
            .then((signInResponse) => getUserProfile(signInResponse.user.uid))
            .then((userProfile) => localStorage.setItem("userProfile", JSON.stringify(userProfile)));
    };

    const logout = () => {
        return firebase.auth().signOut()
            .then(() => localStorage.clear());
    };

    const register = (userProfile, password) => {
        return firebase.auth().createUserWithEmailAndPassword(userProfile.email, password)
            .then((createResponse) => saveUser({ ...userProfile, firebaseUserId: createResponse.user.uid }))
            .then((savedUserProfile) => localStorage.setItem("userProfile", JSON.stringify(savedUserProfile)))
            .then(history.push("/"));
    };

    const getToken = () => firebase.auth().currentUser.getIdToken();

    const getUserProfile = (firebaseUserId) => {
        return getToken().then((token) =>
            fetch(`${apiUrl}/${firebaseUserId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }).then(resp => resp.json()));
    };

    const saveUser = (userProfile) => {
        return getToken().then((token) =>
            fetch(apiUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userProfile)
            }).then(resp => resp.json()));
    };

    return (
        <UserProfileContext.Provider value={{ isLoggedIn, login, logout, register, getToken }}>
            {isFirebaseReady
                ? props.children
                : <Spinner className="app-spinner dark" />}
        </UserProfileContext.Provider>
    );
}