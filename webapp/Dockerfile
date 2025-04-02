FROM node:22

COPY . /app
WORKDIR /app

#Install the dependencies
RUN npm install --omit=dev 

ARG API_URI
ARG LLM_API_KEY
ENV REACT_APP_GATEWAY_SERVICE_URL=$API_URI
ENV REACT_APP_LLM_API_KEY=$LLM_API_KEY

#Create an optimized version of the webapp
RUN npm run build
RUN npm install -g serve --production

#Execute npm run prod to run the server
CMD [ "npm", "run", "prod" ]
#CMD ["npm", "start"]