var gulp = require("gulp");
var prefixer = require("gulp-autoprefixer"),
  uglify = require("gulp-uglify"),
  sass = require("gulp-sass")(require('sass')),
  //   sourcemaps = require("gulp-sourcemaps"),
  rigger = require("gulp-rigger"),
  cssmin = require("gulp-clean-css"),
  imagemin = require("gulp-imagemin"),
  pngquant = require("imagemin-pngquant"),
  del = require("del"),
  browserSync = require("browser-sync"),
  reload = browserSync.reload;

var path = {
  build: {
    //Тут мы укажем куда складывать готовые после сборки файлы
    html: "build/",
    js: "build/js/",
    css: "build/css/",
    img: "build/img/",
    fonts: "build/fonts/"
  },
  src: {
    //Пути откуда брать исходники
    html: "src/html/*.html", //Синтаксис src/*.html говорит gulp что мы хотим взять все файлы с расширением .html
    js: "src/js/main.js", //В стилях и скриптах нам понадобятся только main файлы
    style: "src/scss/styles.scss",
    img: "src/img/**/*.*", //Синтаксис img/**/*.* означает - взять все файлы всех расширений из папки и из вложенных каталогов
    fonts: "src/fonts/**/*.+(woff|woff2|eot|otf|ttf|svg)",
    scss: "src/scss/"
  },
  watch: {
    //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
    html: "src/html/**/*.html",
    js: "src/js/**/*.js",
    style: "src/**/*.+(scss|css)",
    img: "src/img/**/*.*",
    fonts: "src/fonts/**/*.*"
  },
  clean: "./build"
};

var config = {
  server: {
    baseDir: "./build"
  },
  tunnel: true,
  host: "localhost",
  port: 8080,
  logPrefix: ""
};

function html() {
  return gulp
    .src(path.src.html) //Выберем файлы по нужному пути
    .pipe(rigger()) //Прогоним через rigger
    .pipe(gulp.dest(path.build.html)) //Выплюнем их в папку build
    .pipe(reload({ stream: true })); //И перезагрузим наш сервер для обновлений
}

function javascript() {
  return (
    gulp
      .src(path.src.js) //Найдем наш main файл
      .pipe(rigger()) //Прогоним через rigger
      // .pipe(sourcemaps.init()) //Инициализируем sourcemap
      .pipe(uglify()) //Сожмем наш js
      // .pipe(sourcemaps.write("./")) //Пропишем карты
      .pipe(gulp.dest(path.build.js)) //Выплюнем готовый файл в build
      .pipe(reload({ stream: true }))
  ); //И перезагрузим сервер
}

function javascriptDev() {
  return (
    gulp
      .src(path.src.js) //Найдем наш main файл
      .pipe(rigger()) //Прогоним через rigger
      // .pipe(sourcemaps.init()) //Инициализируем sourcemap
      // .pipe(sourcemaps.write("./")) //Пропишем карты
      .pipe(gulp.dest(path.build.js)) //Выплюнем готовый файл в build
      .pipe(reload({ stream: true }))
  ); //И перезагрузим сервер
}

function styles() {
  return (
    gulp
      .src(path.src.style) //Выберем наш main.scss
      // .pipe(sourcemaps.init({ largeFile: true })) //То же самое что и с js
      .pipe(sass()) //Скомпилируем
      .pipe(
        prefixer({
          browsers: ["last 3 version", "> 1%", "ie 8", "ie 7"],
          cascade: false
        })
      ) //Добавим вендорные префиксы
      .pipe(
        cssmin({ processImport: true, debug: true }, details => {
          console.log(
            `${details.name} (origin): ${Math.round(
              details.stats.originalSize / 1024
            )} kb`
          );
          console.log(
            `${details.name} (min):    ${Math.round(
              details.stats.minifiedSize / 1024
            )} kb`
          );
        })
      ) //Сожмем
      // .pipe(sourcemaps.write("./"))
      .pipe(gulp.dest(path.build.css)) //И в build
      .pipe(reload({ stream: true }))
  );
}

function stylesDev() {
  return (
    gulp
      .src(path.src.style) //Выберем наш main.scss
      // .pipe(sourcemaps.init({ largeFile: true })) //То же самое что и с js
      .pipe(sass()) //Скомпилируем
      // .pipe(sourcemaps.write("./"))
      .pipe(gulp.dest(path.build.css)) //И в build
      .pipe(reload({ stream: true }))
  );
}

function images() {
  return gulp
    .src(path.src.img) //Выберем наши картинки
    .pipe(
      imagemin({
        //Сожмем их
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        use: [pngquant()],
        interlaced: true
      })
    )
    .pipe(gulp.dest(path.build.img)) //И бросим в build
    .pipe(reload({ stream: true }));
}

function imagesDev() {
  return gulp
    .src(path.src.img) //Выберем наши картинки
    .pipe(gulp.dest(path.build.img)) //И бросим в build
    .pipe(reload({ stream: true }));
}

function fonts() {
  return gulp.src(path.src.fonts).pipe(gulp.dest(path.build.fonts));
}

function watch(resolve, reject) {
  gulp.watch(path.watch.html, html);
  gulp.watch(path.watch.style, styles);
  gulp.watch(path.watch.js, javascriptDev);
  gulp.watch(path.watch.img, imagesDev);
  gulp.watch(path.watch.fonts, fonts);
  resolve();
}

// function clean() {
//   del([path.clean]);
// }

gulp.task("html:build", html);
gulp.task("js:build", javascript);
gulp.task("style:build", styles);
gulp.task("image:build", images);
gulp.task("fonts:build", fonts);

gulp.task(
  "build",
  gulp.series(
    "html:build",
    "js:build",
    "style:build",
    "fonts:build",
    "image:build"
  )
);
gulp.task("watch", function() {
  return new Promise(watch);
});
// gulp.task(clean);

gulp.task("webserver", function() {
  browserSync(config);
});

gulp.task("default", gulp.series(gulp.parallel("webserver", "watch")));
