
pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'store-inventory-system-collab'
        APP_VERSION = "${BUILD_NUMBER}"
        POSTGRES_DB = 'store_inventory'
        POSTGRES_PORT = '5432'
        POSTGRES_USER = credentials('store-db-user')
        POSTGRES_PASSWORD = credentials('store-db-password')
        DB_HOST = 'postgres'
        DB_NAME = 'store_inventory'
        DB_USER = credentials('store-db-user')
        DB_PASSWORD = credentials('store-db-password')
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
                // Build the test images, but do not start or recreate PostgreSQL.
                sh 'docker compose build inventory-api orders-api frontend'
                sh 'docker compose run --rm --no-deps inventory-api npm test'
                sh 'docker compose run --rm --no-deps orders-api npm test'
            }
        }

        stage('Build Images') {
            steps {
                sh 'docker compose build --pull'
            }
        }

        stage('Deploy') {
            steps {
                // Keep the existing PostgreSQL container and database volume.
                sh 'docker compose up -d --no-deps --no-build inventory-api orders-api frontend proxy'
            }
        }

        stage('Smoke Test') {
            steps {
                sh '''
                    set -eu
                    attempt=0
                    until docker compose exec -T proxy curl -fsS http://localhost/health; do
                        attempt=$((attempt + 1))
                        if [ "$attempt" -ge 20 ]; then
                            echo "Health check failed after retries"
                            exit 1
                        fi
                        sleep 3
                    done

                    docker compose exec -T proxy curl -fsS http://localhost/api/items
                    docker compose exec -T proxy curl -fsS http://localhost/api/orders
                '''
            }
        }
    }

    post {
        always {
            echo "Build finished with result: ${currentBuild.currentResult}"
            echo "Application version: ${APP_VERSION}"
        }
        success {
            echo 'Deployment and smoke tests succeeded.'
        }
        failure {
            echo 'Pipeline failed. Check the stage logs before retrying.'
        }
    }
}
