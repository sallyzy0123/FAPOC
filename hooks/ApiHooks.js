import {useContext, useEffect, useState} from 'react';
import {MainContext} from '../contexts/MainContext';
import {appId, baseUrl} from '../utils/variables';
import AsyncStorage from '@react-native-async-storage/async-storage';

const doFetch = async (url, options) => {
  const response = await fetch(url, options);
  const json = await response.json();
  if (!response.ok) {
    const message = json.error
      ? `${json.message}: ${json.error}`
      : json.message;
    throw new Error(message || response.statusText);
  }
  return json;
};

const useMedia = (myFilesOnly) => {
  const [mediaArray, setMediaArray] = useState([]);
  const {update, user} = useContext(MainContext);

  const loadMedia = async () => {
    try {
      // const response = await fetch(baseUrl + 'media');
      // const json = await response.json();
      let json = await useTag().getFilesByTag(appId);
      // keep users files if MyFilesOnly
      if (myFilesOnly) {
        json = json.filter((file) => file.user_id === user.user_id);
      }
      json.reverse();

      const media = await Promise.all(
        json.map(async (file) => {
          const fileResponse = await fetch(baseUrl + 'media/' + file.file_id);
          // console.log('what are you getting?', fileResponse);
          return await fileResponse.json();
        })
      );
      setMediaArray(media);
    } catch (error) {
      console.error('List, loadMedia', error);
    }
  };

  useEffect(() => {
    loadMedia();
    // load media when update state changes in main context
    // by adding update state to the array below
  }, [update]);

  const postMedia = async (fileData, token) => {
    const options = {
      method: 'post',
      headers: {
        'x-access-token': token,
        'Content-Type': 'multipart/form-data',
      },
      body: fileData,
    };
    try {
      return await doFetch(baseUrl + 'media', options);
    } catch (error) {
      throw new Error('postUpload: ' + error.message);
    }
  };

  const deleteMedia = async (id, token) => {
    try {
      return await doFetch(baseUrl + 'media/' + id, {
        headers: {'x-access-token': token},
        method: 'delete',
      });
    } catch (error) {
      console.log(error);
      throw new Error('deleteMedia: ' + error.message);
    }
  };

  const putMedia = async (id, data, token) => {
    const options = {
      method: 'put',
      headers: {
        'x-access-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
    try {
      return await doFetch(baseUrl + 'media/' + id, options);
    } catch (error) {
      throw new Error('putUpload: ' + error.message);
    }
  };

  return {mediaArray, postMedia, deleteMedia, putMedia, loadMedia};
};

const useAuthentication = () => {
  const postLogin = async (userCredentials) => {
    // user credentials format: {username: 'someUsername', password: 'somePassword'}
    const options = {
      // TODO: add method, headers and body for sending json data with POST
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userCredentials),
    };
    try {
      // TODO: use fetch to send request to login endpoint and return the result as json, handle errors with try/catch and response.ok
      return await doFetch(baseUrl + 'login', options);
    } catch (error) {
      throw new Error('postLogin: ' + error.message);
    }
  };
  return {postLogin};
};

// https://media.mw.metropolia.fi/wbma/docs/#api-User
const useUser = () => {
  const getUserByToken = async (token) => {
    // call https://media.mw.metropolia.fi/wbma/docs/#api-User-CheckUserName
    const options = {
      method: 'GET',
      headers: {'x-access-token': token},
    };
    try {
      return await doFetch(baseUrl + 'users/user', options);
    } catch (error) {
      throw new Error('checkUser: ' + error.message);
    }
  };

  const postUser = async (userData) => {
    const options = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    };
    try {
      return await doFetch(baseUrl + 'users', options);
    } catch (error) {
      throw new Error('postUser: ' + error.message);
    }
  };

  const putUser = async (data, token) => {
    console.log('putUser', data);
    const options = {
      method: 'put',
      headers: {
        'x-access-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
    try {
      return await doFetch(baseUrl + 'users', options);
    } catch (error) {
      throw new Error('putUser: ' + error.message);
    }
  };

  const checkUsername = async (username) => {
    try {
      const result = await doFetch(baseUrl + 'users/username/' + username);
      return result.available;
    } catch (error) {
      throw new Error('checkUsername: ' + error.message);
    }
  };

  const getUserById = async (id, token) => {
    try {
      return await doFetch(baseUrl + 'users/' + id, {
        headers: {'x-access-token': token},
      });
    } catch (error) {
      throw new Error('getUserById, ' + error.message);
    }
  };

  return {getUserByToken, postUser, checkUsername, getUserById, putUser};
};

const useTag = () => {
  const getFilesByTag = async (tag) => {
    try {
      return await doFetch(baseUrl + 'tags/' + tag);
    } catch (error) {
      throw new Error('getFilesByTag, ' + error.message);
    }
  };

  const postTag = async (data, token) => {
    const options = {
      method: 'post',
      headers: {
        'x-access-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
    try {
      return await doFetch(baseUrl + 'tags', options);
    } catch (error) {
      throw new Error('postTag: ' + error.message);
    }
  };

  return {getFilesByTag, postTag};
};

const useFavourite = (token) => {
  const [favouriteArray, setFavouriteArray] = useState([]);
  const {update, user} = useContext(MainContext);

  const postFavourite = async (fileId, token) => {
    const options = {
      method: 'post',
      headers: {
        'x-access-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({file_id: fileId}),
    };
    try {
      return await doFetch(baseUrl + 'favourites', options);
    } catch (error) {
      throw new Error('postFavourite: ' + error.message);
    }
  };

  const getFavouritesByUser = async (token) => {
    const options = {
      method: 'get',
      headers: {'x-access-token': token},
    };
    try {
      // const token = await AsyncStorage.getItem('userToken');

      // const json = await useTag().getFilesByTag(appId);
      console.log('token bla', token);
      return await doFetch(baseUrl + 'favourites', options);

      // const favourites = await Promise.all(
      //   json.map(async (file) => {
      //     return await doFetch(baseUrl + 'favourites', options);
      //     // return await favourites.json();
      //   })
      // );
      // setFavouriteArray(favourites);
      // console.log('getFavouritesByUser bla blar', favourites);
      // return await doFetch(baseUrl + 'favourites', options);
    } catch (error) {
      throw new Error('getFavouritesByUser: ' + error.message);
    }
  };
  // useEffect(() => {
  //   getFavouritesByUser();
  //   // load media when update state changes in main context
  //   // by adding update state to the array below
  // }, []);

  const getFavouritesByFileId = async (fileId) => {
    try {
      return await doFetch(baseUrl + 'favourites/file/' + fileId);
    } catch (error) {
      throw new Error('getFavouritesByFileId: ' + error.message);
    }
  };

  const deleteFavourite = async (fileId, token) => {
    const options = {
      method: 'delete',
      headers: {
        'x-access-token': token,
      },
    };
    try {
      return await doFetch(baseUrl + 'favourites/file/' + fileId, options);
    } catch (error) {
      throw new Error('deleteFavourite: ' + error.message);
    }
  };

  return {
    postFavourite,
    favouriteArray,
    getFavouritesByUser,
    getFavouritesByFileId,
    deleteFavourite,
  };
};

const useComment = () => {
  const postComment = async (data, token) => {
    const options = {
      method: 'post',
      headers: {
        'x-access-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
    try {
      return await doFetch(baseUrl + 'comments', options);
    } catch (error) {
      throw new Error('postComment: ' + error.message);
    }
  };

  const getCommentsByFileId = async (fileId) => {
    try {
      return await doFetch(baseUrl + 'comments/file/' + fileId);
    } catch (error) {
      throw new Error('getCommentsByFileId: ' + error.message);
    }
  };

  const deleteComment = async () => {
    // TODO: implement this
  };

  return {postComment, getCommentsByFileId, deleteComment};
};

export {useMedia, useAuthentication, useUser, useTag, useFavourite, useComment};
