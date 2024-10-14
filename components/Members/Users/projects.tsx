import React, { useEffect, useState } from "react";
import SideNav from "../sidenav";
import styles from "../../../constants/styles";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../../../context/authContext";
import Checkpoints from "../checkpoints";
import { ITaskData, ITaskInstanceData, getAssignedTaskInstances, getRoleMappedTasks, chooseTask, ITaskInstanceCreateData } from "../../../apis/tasks";
import { auth } from "../../../firebase";

const Projects = () => {
  const { authUser } = useAuth();
  const [state, setState] = useState("");
  const [selectedTask, setSelectedTask] = useState<ITaskInstanceData>()
  const [confirmTask, setConfirmTask] = useState<ITaskData>();
  const [tasks, setTasks] = useState<ITaskData[]>([]);
  const [instances, setInstances] = useState<ITaskInstanceData[]>([])

  useEffect(() => {
    if (!authUser) return;
    let jwt = localStorage.getItem("token");
    if(jwt) {
        getAssignedTaskInstances(jwt)
            .then((instances) => {
                setInstances(instances);
                setSelectedTask(instances[0]);
                if(instances.length==0) {
                    setState("selection");
                    return false
                }
                setState("inprogress")
                return true;
            }).then((isAssigned) => {
                if(!isAssigned) {
                    getRoleMappedTasks(jwt).then((tasks) => {
                        setTasks(tasks);
                    })
                }
            })
    }
  }, []);

  useEffect(() => {
    console.log("tasks",tasks);
    console.log("instances",instances);
    
  }, [tasks, instances])

  const onChoose = (index: number) => {
    setState("confirmation");
    setConfirmTask(tasks[index]);
  };

  const closeConfirmation = () => {
    setState("selection");
    setConfirmTask(undefined);
  };

  const selectProject = () => {
    if (!confirmTask) return;

    let jwt = localStorage.getItem("token");
    if(jwt) {
        let body: ITaskInstanceCreateData = {
            name: `${authUser?.name}-${confirmTask.title}`,
            dpUrl: "",
            type: "",
            description: "",
            status: "In-progress",
            completionPercentage: 0

        };
        chooseTask(confirmTask.id, jwt, body).then((res) => {
            console.log(body);
            
            setState("inprogress")
            if(res) setSelectedTask(res);
        })
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col md:grid grid-cols-12 h-screen" style={{ background: "#EFEFEF" }}>
        <SideNav />

        <div className="px-4 relative overflow-y-scroll md:px-12 md:col-span-9">
          <h1 className="text-4xl font-bold mt-14 md:mt-8" style={{ color: "#AAAAAA" }}>
            {(state === "selection" || state === "confirmation") && "Choose your major project"}
            {state === "inprogress" && "Project Progress"}
          </h1>
          {!state && (
            <div className="flex justify-center text-2xl mt-16 font-bold" style={{ color: "#AAAAAA" }}>
              You have no projects at the moment!
            </div>
          )}
          {state && state !== "inprogress" && (
            <p className="mt-2 text-lg font-bold" style={{ color: "#AAAAAA" }}>
              You can choose any one project that you feel you can complete. You will be assigned mentors for each project
            </p>
          )}

          {state === "selection" && (
            <div className="my-8">
              {tasks?.map((task, index) => (
                <div key={task.title} className="row-span-5 bg-white rounded-xl mb-8 w-full grid grid-cols-7 md:grid-cols-8">
                  <div className="col-span-7 p-4 md:p-8">
                    <h3 className="md:text-3xl font-extrabold text-2xl" style={styles.textPrimary}>
                      {task.title}
                    </h3>
                    <div className="flex gap-2 mt-2 flex-col text-center md:flex-row text-sm md:text-normal">
                      {task.subtitle && 
                        <div key={task.subtitle} className="py-1 px-4 rounded-xl" style={{ background: "#C2FFF4" }}>
                          <p>{task.subtitle}</p>
                        </div>
                      }
                    </div>
                    <p className="mt-4">{task.description}</p>
                  </div>
                  <div className="flex md:flex-col text-white font-bold text-lg col-span-7 md:col-span-1">
                    <a
                      className="flex flex-1 items-center justify-center rounded-bl-xl md:rounded-bl-none md:rounded-tr-xl cursor-pointer"
                      style={{ background: "#95C5E2" }}
                      href={task.psLink}
                      target="_blank"
                    >
                      VIEW PS
                    </a>
                    <a className="text-center flex-1 md:flex-none py-4 px-2 rounded-br-xl cursor-pointer" style={{ background: "#0C72B0" }} onClick={() => onChoose(index)}>
                      CHOOSE
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {state === "confirmation" && (
            <div className="bg-white rounded-xl mb-4 md:my-20 shadow-xl md:mx-12">
              <div className="p-8">
                <h3 className="md:text-3xl font-extrabold text-2xl" style={styles.textPrimary}>
                  <span className="text-red-500">⚠️</span> {confirmTask?.title}
                </h3>
                <p className="mt-4 text-lg font-semibold" style={{ color: "#AAAAAA" }}>
                  Are you sure you want to choose the project ?
                </p>
                <p className="text-lg font-semibold" style={{ color: "#AAAAAA" }}>
                  Once you choose the project you can't go back and change the project that you have chosen.
                </p>
              </div>
              <div className="flex text-center text-white font-bold text-lg">
                <a className="flex-1 p-2 rounded-bl-xl cursor-pointer" style={{ background: "#0C72B0" }} onClick={() => selectProject()}>
                  proceed
                </a>
                <a className="flex-1 p-2 rounded-br-xl cursor-pointer" style={{ background: "#8D989F" }} onClick={() => closeConfirmation()}>
                  close
                </a>
              </div>
            </div>
          )}

          {state === "inprogress" && (
            <>
              {selectedTask && <Checkpoints instanceData={selectedTask!} />}
              <div className="my-4 flex justify-between text-white">
                {selectedTask?.task.submissionLink && (
                  <a className="font-bold float-right px-3 py-2 rounded-xl shadow-md" style={{ background: "#0C72B0" }} href={selectedTask?.task.submissionLink} target="_blank">
                    Add Submission
                  </a>
                )}
                <p className="font-bold rounded-xl py-2 px-5 text-center shadow-md" style={{ background: "#0C72B0" }}>
                  {selectedTask?.status === null ? "In-progress" : selectedTask?.status}
                </p>
              </div>
            </>
          )}
        </div>  
      </div>
    </ProtectedRoute>
  );
};

export default Projects;