import Link from "next/link";

import { ArrowRight, FileText, Github, Lock, Upload } from "lucide-react";

import ui from "@/content/ui.json";
import { ROUTES } from "@/lib/constants";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-light text-white mb-4">
            {ui.home.title}
          </h1>

          <p className="text-xl text-slate-300 mb-8">{ui.home.subtitle}</p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href={ROUTES.ADMIN.ROOT}
              className="flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/80 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-lg"
            >
              {ui.common.goToAdmin}

              <ArrowRight className="w-5 h-5" />
            </Link>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 backdrop-blur-sm font-semibold text-lg"
            >
              <Github className="w-5 h-5" />

              {ui.common.viewOnGithub}
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-purple-400" />
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">
              {ui.home.features.secureAuth.title}
            </h3>

            <p className="text-slate-300 text-sm">
              {ui.home.features.secureAuth.description}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-pink-400" />
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">
              {ui.home.features.blockEditor.title}
            </h3>

            <p className="text-slate-300 text-sm">
              {ui.home.features.blockEditor.description}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-black/20 rounded-lg flex items-center justify-center mb-4">
              <Github className="w-6 h-6 text-gray-700" />
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">
              {ui.home.features.gitStorage.title}
            </h3>

            <p className="text-slate-300 text-sm">
              {ui.home.features.gitStorage.description}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-green-400" />
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">
              {ui.home.features.imageUploads.title}
            </h3>

            <p className="text-slate-300 text-sm">
              {ui.home.features.imageUploads.description}
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">
            {ui.home.quickStart.title}
          </h2>

          <ol className="space-y-3 text-slate-300">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>

              <span>{ui.home.quickStart.step1}</span>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>

              <span>
                {ui.home.quickStart.step2.replace(".env.local", "")}{" "}
                <code className="bg-black/30 px-2 py-1 rounded">
                  .env.local
                </code>
              </span>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>

              <span>{ui.home.quickStart.step3}</span>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </span>

              <span>{ui.home.quickStart.step4}</span>
            </li>
          </ol>

          <div className="mt-6">
            <Link
              href={ROUTES.ADMIN.ROOT}
              className="inline-flex items-center gap-2 text-primary-foreground hover:text-purple-300 font-semibold"
            >
              {ui.home.getStarted}

              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
