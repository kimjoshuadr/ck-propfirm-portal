# Build the SPA, then serve the bundle from nginx.
#
# The Coolify "static" build pack copies the repository into the web root, which
# for this app would serve the Vite entry file instead of a bundle — `npm run
# build` never ran. Building here keeps the deployment honest: the image
# contains what `npm run build` produces, nothing else.
FROM node:22-alpine AS build
WORKDIR /app

# Dependencies first, so a source change does not reinstall them.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist-vue /usr/share/nginx/html
EXPOSE 80
