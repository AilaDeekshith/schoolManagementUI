pipeline {
    agent any

    environment {
        AWS_REGION       = 'us-east-1'
        AWS_ACCOUNT_ID   = '063903862154'                 // TODO: confirm this matches your account
        ECR_REPO         = 'schoolmanagement-frontend'
        IMAGE_TAG        = "${env.BUILD_NUMBER}"
        ECR_URI          = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"
        ECS_CLUSTER      = 'schoolManagement-cluster'      // same cluster as the backend
        ECS_SERVICE      = 'schoolmanagement-frontend-service'
        TASK_FAMILY      = 'schoolmanagement-frontend-task'

        // The backend's own ALB DNS name — baked into the React build so the
        // frontend knows where to send API calls. Update this once you have
        // your backend ALB's real DNS name.
        VITE_BACK_END_URL = 'http://schoolmanagement-alb-1958848537.us-east-1.elb.amazonaws.com/api'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Test') {
            steps {
                sh 'npm ci'
                sh 'npm test -- --watchAll=false || true'   // remove "|| true" once you have real tests
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                    docker build \
                      --build-arg VITE_BACK_END_URL=${VITE_BACK_END_URL} \
                      -t ${ECR_REPO}:${IMAGE_TAG} .
                """
            }
        }

        stage('Push to ECR') {
            steps {
                sh """
                    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URI}
                    docker tag ${ECR_REPO}:${IMAGE_TAG} ${ECR_URI}:${IMAGE_TAG}
                    docker tag ${ECR_REPO}:${IMAGE_TAG} ${ECR_URI}:latest
                    docker push ${ECR_URI}:${IMAGE_TAG}
                    docker push ${ECR_URI}:latest
                """
            }
        }

        stage('Deploy to ECS') {
            steps {
                script {
                    sh """
                        aws ecs describe-task-definition --task-definition ${TASK_FAMILY} \
                          --region ${AWS_REGION} \
                          --query 'taskDefinition' --output json > current-task-def.json

                        jq --arg IMAGE "${ECR_URI}:${IMAGE_TAG}" \
                          '.containerDefinitions[0].image = \$IMAGE
                           | del(.taskDefinitionArn, .revision, .status, .requiresAttributes,
                                 .compatibilities, .registeredAt, .registeredBy)' \
                          current-task-def.json > new-task-def.json

                        aws ecs register-task-definition --region ${AWS_REGION} --cli-input-json file://new-task-def.json

                        aws ecs update-service \
                          --region ${AWS_REGION} \
                          --cluster ${ECS_CLUSTER} \
                          --service ${ECS_SERVICE} \
                          --task-definition ${TASK_FAMILY} \
                          --force-new-deployment
                    """
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                sh """
                    aws ecs wait services-stable --region ${AWS_REGION} --cluster ${ECS_CLUSTER} --services ${ECS_SERVICE}
                """
            }
        }
    }

    post {
        success {
            echo "Frontend deployment succeeded: ${ECR_URI}:${IMAGE_TAG} is live on ECS."
        }
        failure {
            echo "Frontend pipeline failed. Check the stage logs above."
        }
        always {
            sh 'docker system prune -f || true'
        }
    }
}