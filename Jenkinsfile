pipeline {
  agent any

  environment {
    APP_VERSION = "${env.BUILD_NUMBER}"
  }

  triggers {
    pollSCM('H/2 * * * *')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Test') {
      steps {
        sh 'docker compose up -d postgres'
        sh 'docker compose build inventory-api orders-api frontend'
        sh 'docker compose run --rm inventory-api npm test'
        sh 'docker compose run --rm orders-api npm test'
      }
    }

    stage('Build Images') {
      steps {
        sh 'APP_VERSION=${BUILD_NUMBER} docker compose build --pull'
      }
    }

    stage('Deploy') {
      steps {
        sh 'APP_VERSION=${BUILD_NUMBER} docker compose up -d --no-build'
      }
    }

    stage('Smoke Test') {
      steps {
        sh 'curl -fsS http://localhost/health'
        sh 'curl -fsS http://localhost/api/items'
        sh 'curl -fsS http://localhost/api/orders'
      }
    }
  }

  post {
    always {
      echo "Build finished with result: ${currentBuild.currentResult}"
      echo "Application version deployed: ${APP_VERSION}"
    }
    success {
      echo 'Deployment succeeded.'
    }
    failure {
      echo 'Deployment failed. No new version was deployed to production.'
    }
  }
}
