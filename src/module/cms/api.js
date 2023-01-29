const axios = require("axios");
const FormData = require("form-data");
const baseURL = process.env.MESSAGE_CENTER_URL || 'http://106.75.189.162:8020/message-center'

const uploadPicture = async (req) => {
  let data = new FormData();
  data.append('file',req.files[0].buffer,{ contentType: req.files[0].mimetype, filename: req.files[0].originalname } );
  const config = {
    method: 'post',
    url: baseURL + '/upload/img',
    headers: {
      'AUTHORIZATION': 'eb14bdffa53a21d6e60bec826fd2659f',
      'content-type': 'multipart/form-data',
      ...data.getHeaders()
    },
    data: data
  };
  // console.log(config);
  return axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.error('uploadPicture error:', error);
    });
}

const uploadVideo = async (req) => {
  let data = new FormData();
  data.append('file',req.files[0].buffer,{ contentType: req.files[0].mimetype, filename: req.files[0].originalname } );
  const config = {
    method: 'post',
    url: baseURL + '/upload/video',
    headers: {
      'AUTHORIZATION': 'eb14bdffa53a21d6e60bec826fd2659f',
      'content-type': 'multipart/form-data',
      ...data.getHeaders()
    },
    data: data
  };
  return axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.error('uploadVideo error:', error);
    });
}

const uploadZip = async (req) => {
  let data = new FormData();
  data.append('file',req.files[0].buffer,{ contentType: req.files[0].mimetype, filename: req.files[0].originalname } );
  const config = {
    method: 'post',
    url: baseURL + '/upload/zip',
    headers: {
      'AUTHORIZATION': 'eb14bdffa53a21d6e60bec826fd2659f',
      'content-type': 'multipart/form-data',
      ...data.getHeaders()
    },
    data: data
  };
  return axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.error('uploadZip error:', error);
    });
}

module.exports = {
  uploadPicture,
  uploadVideo,
  uploadZip,
}
